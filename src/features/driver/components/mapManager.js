/**
 * Gerenciador do mapa vetorial do motorista.
 * OpenFreeMap fornece os tiles e o MapLibre renderiza câmera, rota e marcadores.
 */

import { APP_CONFIG } from '../config.js';
import { disableMapPropagation } from '../../../shared/utils/domUtils.js';
import { calculateBearing, calculateDistance } from '../../../shared/utils/geoUtils.js';
import {
  MAX_ROUTE_MAP_ZOOM,
  OPEN_FREE_MAP_STYLE,
  boundsFromCoordinates,
  createHtmlElement,
  emptyLineFeature,
  featureCollection,
  lineFeature,
  maplibregl,
  setSourceData,
  toLatLng,
  toLngLat
} from '../../../shared/map/openFreeMap.js';
import {
  ROUTE_LEG_OPACITY,
  buildRouteLegFeatures,
  findStopCoordinateIndices,
  getActiveLegIndex,
  getRouteLegRanges,
  getRouteLegStatus
} from '../../../shared/map/routeLegs.js';

const MAP_IDS = Object.freeze({
  routeSource: 'driver-route-source',
  routeOutline: 'driver-route-outline',
  routeLine: 'driver-route-line',
  trafficSource: 'driver-traffic-source',
  trafficLine: 'driver-traffic-line',
  approachSource: 'driver-approach-source',
  approachLine: 'driver-approach-line'
});

function asPosition(value) {
  if (Array.isArray(value)) return { lat: Number(value[0]), lng: Number(value[1]) };
  return { lat: Number(value.lat), lng: Number(value.lng) };
}

export class MapManager {
  constructor(containerId, options = {}) {
    this.containerId = containerId;
    this.options = options;
    this.map = null;
    this.mapLoaded = false;
    this.routeCoordinates = [];
    this.visibleRouteCoordinates = [];
    this.trafficSections = [];
    this.stopCoordinateIndices = [];
    this.activeLegIndex = 0;
    this.visualRouteCoordIndex = 0;
    this.targetRouteCoordIndex = 0;
    this.lastRouteVisualSyncAt = 0;
    this.vehicleMarker = null;
    this.currentLocationMarker = null;
    this.approachCoordinates = [];
    this.originMarker = null;
    this.destMarker = null;
    this.stopMarkers = [];
    this.trafficEventsBound = false;
    this.isFollowingVehicle = true;
    this.currentMapBearing = 0;
    this.smoothedBearing = 0;
    this.vehicleAnimationFrame = null;
    this.lastVehicleUpdateAt = 0;
    this.navigationPitch = 52;
    this.navigationZoom = MAX_ROUTE_MAP_ZOOM;
  }

  init(initialCenter = [-23.507248, -46.653695], initialZoom = 18) {
    this.map = new maplibregl.Map({
      container: this.containerId,
      style: OPEN_FREE_MAP_STYLE,
      center: toLngLat(initialCenter),
      zoom: Math.min(initialZoom, MAX_ROUTE_MAP_ZOOM),
      pitch: 42,
      bearing: 0,
      attributionControl: true,
      maxZoom: MAX_ROUTE_MAP_ZOOM,
      cooperativeGestures: false
    });

    const initializeStyleLayers = () => {
      if (this.mapLoaded || !this.map.getStyle()?.layers?.length) return;
      this.mapLoaded = true;
      document.getElementById(this.containerId)?.setAttribute('data-map-ready', 'true');
      this.ensureMapLayers();
      this.renderRouteLayers();
      this.renderApproachLine();
      this.map.resize();
    };
    this.map.on('styledata', initializeStyleLayers);
    this.map.on('load', initializeStyleLayers);

    ['dragstart', 'rotatestart', 'pitchstart', 'zoomstart'].forEach((eventName) => {
      this.map.on(eventName, (event) => {
        if (!event.originalEvent || !this.isFollowingVehicle) return;
        this.setFollowVehicle(false);
        this.options.onCameraModeChange?.(false);
      });
    });

    disableMapPropagation(document.querySelector('.ui-overlay'));
    return this;
  }

  ensureMapLayers() {
    if (!this.mapLoaded) return;

    if (!this.map.getSource(MAP_IDS.routeSource)) {
      this.map.addSource(MAP_IDS.routeSource, { type: 'geojson', data: emptyLineFeature() });
    }
    if (!this.map.getLayer(MAP_IDS.routeOutline)) {
      this.map.addLayer({
        id: MAP_IDS.routeOutline,
        type: 'line',
        source: MAP_IDS.routeSource,
        layout: { 'line-cap': 'round', 'line-join': 'round' },
        paint: {
          'line-color': APP_CONFIG.colors.primaryNavy,
          'line-width': 12,
          'line-opacity': ['coalesce', ['get', 'outlineOpacity'], 0.92]
        }
      });
    }
    if (!this.map.getLayer(MAP_IDS.routeLine)) {
      this.map.addLayer({
        id: MAP_IDS.routeLine,
        type: 'line',
        source: MAP_IDS.routeSource,
        layout: { 'line-cap': 'round', 'line-join': 'round' },
        paint: {
          'line-color': '#4F46E5',
          'line-width': 7,
          'line-opacity': ['coalesce', ['get', 'opacity'], 1]
        }
      });
    }

    if (!this.map.getSource(MAP_IDS.trafficSource)) {
      this.map.addSource(MAP_IDS.trafficSource, { type: 'geojson', data: featureCollection() });
    }
    if (!this.map.getLayer(MAP_IDS.trafficLine)) {
      this.map.addLayer({
        id: MAP_IDS.trafficLine,
        type: 'line',
        source: MAP_IDS.trafficSource,
        layout: { 'line-cap': 'round', 'line-join': 'round' },
        paint: {
          'line-color': ['get', 'color'],
          'line-width': 8,
          'line-opacity': ['coalesce', ['get', 'opacity'], 1]
        }
      });
    }

    if (!this.map.getSource(MAP_IDS.approachSource)) {
      this.map.addSource(MAP_IDS.approachSource, { type: 'geojson', data: emptyLineFeature() });
    }
    if (!this.map.getLayer(MAP_IDS.approachLine)) {
      this.map.addLayer({
        id: MAP_IDS.approachLine,
        type: 'line',
        source: MAP_IDS.approachSource,
        layout: { 'line-cap': 'round', 'line-join': 'round' },
        paint: {
          'line-color': '#38BDF8',
          'line-width': 4,
          'line-opacity': 0.68,
          'line-dasharray': [2, 2.5]
        }
      });
    }

    if (!this.trafficEventsBound) {
      this.trafficEventsBound = true;
      this.map.on('mouseenter', MAP_IDS.trafficLine, () => {
        this.map.getCanvas().style.cursor = 'pointer';
      });
      this.map.on('mouseleave', MAP_IDS.trafficLine, () => {
        this.map.getCanvas().style.cursor = '';
      });
      this.map.on('click', MAP_IDS.trafficLine, (event) => {
        const properties = event.features?.[0]?.properties;
        if (!properties) return;
        new maplibregl.Popup({
          closeButton: false,
          closeOnClick: true,
          offset: 8,
          className: 'traffic-map-popup'
        })
          .setLngLat(event.lngLat)
          .setDOMContent(this.createTrafficPopup(properties))
          .addTo(this.map);
      });
    }
  }

  drawRoute(coordinates, trafficSections = [], stops = []) {
    if (!Array.isArray(coordinates) || coordinates.length < 2) return;
    this.routeCoordinates = coordinates.map((coordinate) => [...coordinate]);
    this.visibleRouteCoordinates = this.routeCoordinates.map((coordinate) => [...coordinate]);
    this.trafficSections = (trafficSections || [])
      .map((section, index) => ({ ...section, id: `traffic-${index}` }))
      .filter((section) => {
        const start = Number(section.startPointIndex);
        const end = Number(section.endPointIndex);
        return Number.isInteger(start) && Number.isInteger(end) && end > start;
      });
    this.stopCoordinateIndices = findStopCoordinateIndices(this.routeCoordinates, stops);
    this.activeLegIndex = 0;
    this.visualRouteCoordIndex = 0;
    this.targetRouteCoordIndex = 0;
    this.renderRouteLayers();
  }

  renderRouteLayers(visualPosition = null) {
    if (!this.mapLoaded) return;
    this.ensureMapLayers();
    const routeFeatures = buildRouteLegFeatures(
      this.routeCoordinates,
      this.stopCoordinateIndices,
      this.activeLegIndex,
      lineFeature,
      { startIndex: this.visualRouteCoordIndex, startPosition: visualPosition }
    );
    setSourceData(this.map, MAP_IDS.routeSource, featureCollection(routeFeatures));
    setSourceData(
      this.map,
      MAP_IDS.trafficSource,
      featureCollection(this.buildTrafficFeatures(visualPosition))
    );
  }

  buildTrafficFeatures(visualPosition = null) {
    const legRanges = getRouteLegRanges(
      this.routeCoordinates.length,
      this.stopCoordinateIndices
    );
    return this.trafficSections.flatMap((section) => {
      const sectionStart = Math.max(0, Number(section.startPointIndex));
      const sectionEnd = Math.min(this.routeCoordinates.length - 1, Number(section.endPointIndex));
      if (sectionEnd <= this.visualRouteCoordIndex) return [];
      return legRanges.flatMap((range) => {
        const start = Math.max(sectionStart, range.startIndex, this.visualRouteCoordIndex);
        const end = Math.min(sectionEnd, range.endIndex);
        if (end <= start) return [];
        let segment = this.routeCoordinates.slice(start, end + 1);
        if (start === this.visualRouteCoordIndex && visualPosition) {
          segment = [visualPosition, ...this.routeCoordinates.slice(start + 1, end + 1)];
        }
        if (segment.length < 2) return [];
        const status = getRouteLegStatus(range.legIndex, this.activeLegIndex);
        return [lineFeature(segment, {
          id: `${section.id}-leg-${range.legIndex}`,
          color: this.trafficColor(section),
          opacity: ROUTE_LEG_OPACITY[status],
          simpleCategory: String(section.simpleCategory || ''),
          delayInSeconds: Number(section.delayInSeconds) || 0,
          effectiveSpeedInKmh: Number(section.effectiveSpeedInKmh) || 0
        })];
      });
    });
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
    const value = Number(seconds) || 0;
    if (!value) return 'Atraso não informado';
    if (value < 60) return `Atraso de ${value} s`;
    return `Atraso de ${Math.max(1, Math.round(value / 60))} min`;
  }

  createTrafficPopup(section) {
    const content = document.createElement('div');
    content.className = 'traffic-route-popup';
    const title = document.createElement('strong');
    title.textContent = this.trafficCategoryLabel(section.simpleCategory);
    content.appendChild(title);
    const delay = document.createElement('span');
    delay.textContent = this.formatTrafficDelay(section.delayInSeconds);
    content.appendChild(delay);
    if (Number(section.effectiveSpeedInKmh) > 0) {
      const speed = document.createElement('span');
      speed.textContent = `Velocidade média: ${Math.round(section.effectiveSpeedInKmh)} km/h`;
      content.appendChild(speed);
    }
    return content;
  }

  updateRemainingRoute(remainingCoordinates, closestCoordIndex = 0) {
    if (!remainingCoordinates || remainingCoordinates.length < 2) return;
    this.targetRouteCoordIndex = Math.max(this.visualRouteCoordIndex, closestCoordIndex);
    const markerPosition = this.vehicleMarker?.getLngLat();
    this.syncRouteToVisualPosition(markerPosition ? toLatLng(markerPosition) : remainingCoordinates[0]);
  }

  syncRouteToVisualPosition(visualPosition) {
    if (!visualPosition || this.routeCoordinates.length < 2) return;
    let smallestDistance = Infinity;
    let nearestIndex = this.visualRouteCoordIndex;
    const searchStart = Math.max(0, this.visualRouteCoordIndex - 3);
    const searchEnd = Math.min(
      this.routeCoordinates.length - 1,
      Math.max(this.targetRouteCoordIndex + 25, searchStart + 40)
    );
    for (let index = searchStart; index <= searchEnd; index++) {
      const coordinate = this.routeCoordinates[index];
      const distance = calculateDistance(
        visualPosition[0], visualPosition[1], coordinate[0], coordinate[1]
      );
      if (distance < smallestDistance) {
        smallestDistance = distance;
        nearestIndex = index;
      }
    }
    this.visualRouteCoordIndex = Math.max(this.visualRouteCoordIndex, nearestIndex);
    this.activeLegIndex = getActiveLegIndex(
      this.visualRouteCoordIndex,
      this.stopCoordinateIndices
    );
    this.visibleRouteCoordinates = [
      visualPosition,
      ...this.routeCoordinates.slice(this.visualRouteCoordIndex + 1)
    ];
    this.renderRouteLayers(visualPosition);
  }

  fitRouteBounds(coordinates) {
    const bounds = boundsFromCoordinates(coordinates);
    if (!bounds) return;
    this.setFollowVehicle(false);
    this.map.fitBounds(bounds, {
      padding: { top: 100, right: 40, bottom: 100, left: 40 },
      maxZoom: MAX_ROUTE_MAP_ZOOM,
      duration: 550,
      pitch: 0,
      bearing: 0
    });
  }

  createMarker(className, html, position, options = {}) {
    const element = createHtmlElement(className, html);
    return new maplibregl.Marker({
      element,
      anchor: options.anchor || 'center',
      rotationAlignment: options.rotationAlignment || 'viewport',
      pitchAlignment: options.pitchAlignment || 'viewport'
    }).setLngLat(toLngLat(position)).addTo(this.map);
  }

  setOriginMarker(position) {
    this.originMarker?.remove();
    this.originMarker = this.createMarker(
      'custom-pin-marker maplibre-driver-pin',
      '<div class="origin-pin-icon"></div>',
      position
    );
  }

  setDestinationMarker(position) {
    this.destMarker?.remove();
    this.destMarker = this.createMarker(
      'custom-pin-marker maplibre-driver-destination',
      `<div class="destination-pin-icon">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
          <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/>
          <circle cx="12" cy="10" r="3"/>
        </svg>
      </div>`,
      position
    );
  }

  setStopMarkers(stops = []) {
    this.stopMarkers.forEach((marker) => marker.remove());
    this.stopMarkers = stops.map((stop, index) => this.createMarker(
      'custom-pin-marker maplibre-driver-stop',
      `<div class="route-stop-pin" aria-label="Parada ${index + 1}">${index + 1}</div>`,
      [stop.lat, stop.lng]
    ));
  }

  showCurrentLocationApproach(currentPosition, routeStart, { fitBounds = false } = {}) {
    if (!currentPosition || !routeStart) return;
    if (!this.currentLocationMarker) {
      this.currentLocationMarker = this.createMarker(
        'custom-pin-marker maplibre-current-location',
        '<div class="driver-current-location-dot" aria-label="Posição atual do motorista"></div>',
        currentPosition
      );
    } else {
      this.currentLocationMarker.setLngLat(toLngLat(currentPosition));
    }
    this.approachCoordinates = [currentPosition, routeStart];
    this.renderApproachLine();
    if (fitBounds) this.fitApproachBounds(currentPosition, routeStart);
  }

  renderApproachLine() {
    if (!this.mapLoaded) return;
    this.ensureMapLayers();
    setSourceData(
      this.map,
      MAP_IDS.approachSource,
      this.approachCoordinates.length >= 2
        ? lineFeature(this.approachCoordinates)
        : emptyLineFeature()
    );
  }

  fitApproachBounds(currentPosition, routeStart) {
    const bounds = boundsFromCoordinates([currentPosition, routeStart]);
    if (!bounds) return;
    this.setFollowVehicle(false);
    this.map.fitBounds(bounds, {
      padding: { top: 112, right: 48, bottom: 150, left: 48 },
      maxZoom: 16,
      duration: 550,
      pitch: 0,
      bearing: 0
    });
    this.options.onCameraModeChange?.(false);
  }

  clearCurrentLocationApproach() {
    this.currentLocationMarker?.remove();
    this.currentLocationMarker = null;
    this.approachCoordinates = [];
    this.renderApproachLine();
  }

  getRoundedArrowSvg() {
    return `<svg viewBox="0 0 36 36" class="waze-arrow-svg">
      <path d="M18 4.2 C18.6 4.2 19.2 4.6 19.6 5.2 L30.8 25.2 C31.4 26.3 30.6 27.6 29.4 27.2 L18.6 23.4 C18.2 23.2 17.8 23.2 17.4 23.4 L6.6 27.2 C5.4 27.6 4.6 26.3 5.2 25.2 L16.4 5.2 C16.8 4.6 17.4 4.2 18 4.2 Z" fill="#0084FF" stroke="#FFFFFF" stroke-width="2.2" stroke-linejoin="round" stroke-linecap="round"/>
    </svg>`;
  }

  updateSmoothedBearing(targetBearing) {
    let difference = Number(targetBearing) - this.smoothedBearing;
    if (difference > 180) difference -= 360;
    if (difference < -180) difference += 360;
    if (Math.abs(difference) > 3) this.smoothedBearing += difference * 0.15;
    this.currentMapBearing = Number(targetBearing) || 0;
    return this.smoothedBearing;
  }

  followCamera(position, bearing, immediate = true) {
    if (!this.isFollowingVehicle || !this.map) return;
    const camera = {
      center: toLngLat(position),
      bearing: this.updateSmoothedBearing(bearing),
      pitch: this.navigationPitch,
      zoom: this.navigationZoom
    };
    if (immediate) this.map.jumpTo(camera);
    else this.map.easeTo({ ...camera, duration: 500, essential: true });
  }

  updateVehiclePosition(latLng, bearing = 0, routeCoordIndex = null) {
    if (!latLng) return;
    let targetPosition = asPosition(latLng);
    const now = performance.now();
    const followsRouteGeometry = Number.isInteger(routeCoordIndex) && this.routeCoordinates.length > 1;

    if (followsRouteGeometry) {
      this.targetRouteCoordIndex = Math.max(this.visualRouteCoordIndex, routeCoordIndex);
      if (this.vehicleMarker) {
        const currentPosition = this.vehicleMarker.getLngLat();
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
      this.currentMapBearing = bearing;
      const element = createHtmlElement(
        'custom-pin-marker maplibre-driver-vehicle',
        `<div class="waze-vehicle-container" id="waze-vehicle-marker-dom">
          <div class="waze-vehicle-shadow"></div>
          <div class="waze-vehicle-arrow-wrapper">${this.getRoundedArrowSvg()}</div>
        </div>`
      );
      this.vehicleMarker = new maplibregl.Marker({
        element,
        anchor: 'center',
        rotationAlignment: 'map',
        pitchAlignment: 'viewport'
      })
        .setLngLat([targetPosition.lng, targetPosition.lat])
        .setRotation(bearing)
        .addTo(this.map);
      this.lastVehicleUpdateAt = now;
      this.followCamera([targetPosition.lat, targetPosition.lng], bearing);
      return;
    }

    const elapsed = this.lastVehicleUpdateAt ? now - this.lastVehicleUpdateAt : 1000;
    this.lastVehicleUpdateAt = now;
    const reduceMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    const duration = reduceMotion ? 0 : Math.min(2800, Math.max(450, elapsed * 0.92));
    this.animateVehicleTo(
      targetPosition,
      duration,
      followsRouteGeometry ? this.targetRouteCoordIndex : null,
      bearing
    );
  }

  updateVehicleArrow(bearing) {
    this.vehicleMarker?.setRotation(Number.isFinite(bearing) ? bearing : this.currentMapBearing);
  }

  routeSegmentProgress(position, coordIndex) {
    const start = this.routeCoordinates[coordIndex];
    const end = this.routeCoordinates[coordIndex + 1];
    if (!start || !end) return 1;
    const current = asPosition(position);
    const deltaLat = end[0] - start[0];
    const deltaLng = end[1] - start[1];
    const lengthSquared = deltaLat * deltaLat + deltaLng * deltaLng;
    if (!lengthSquared) return 1;
    const progress = (
      (current.lat - start[0]) * deltaLat + (current.lng - start[1]) * deltaLng
    ) / lengthSquared;
    return Math.max(0, Math.min(1, progress));
  }

  createVehicleAnimationPath(startPosition, targetPosition, targetRouteIndex) {
    if (!Number.isInteger(targetRouteIndex) || this.routeCoordinates.length < 2) {
      return [asPosition(startPosition), asPosition(targetPosition)];
    }
    const endIndex = Math.min(this.routeCoordinates.length - 1, targetRouteIndex);
    const points = [asPosition(startPosition)];
    for (let index = this.visualRouteCoordIndex + 1; index <= endIndex; index++) {
      points.push(asPosition(this.routeCoordinates[index]));
    }
    const target = asPosition(targetPosition);
    const last = points[points.length - 1];
    if (calculateDistance(last.lat, last.lng, target.lat, target.lng) > 0.3) points.push(target);
    return points;
  }

  animateVehicleTo(targetPosition, duration, targetRouteIndex = null, fallbackBearing = 0) {
    if (!this.vehicleMarker) return;
    if (this.vehicleAnimationFrame) cancelAnimationFrame(this.vehicleAnimationFrame);
    const startPosition = this.vehicleMarker.getLngLat();
    const path = this.createVehicleAnimationPath(startPosition, targetPosition, targetRouteIndex);
    const segments = [];
    let totalDistance = 0;
    for (let index = 0; index < path.length - 1; index++) {
      const start = path[index];
      const end = path[index + 1];
      const distance = calculateDistance(start.lat, start.lng, end.lat, end.lng);
      if (distance <= 0) continue;
      segments.push({ start, end, distance, offset: totalDistance });
      totalDistance += distance;
    }
    const target = asPosition(targetPosition);
    if (duration <= 0 || totalDistance < 0.5 || !segments.length) {
      this.vehicleMarker.setLngLat([target.lng, target.lat]);
      if (!Number.isInteger(targetRouteIndex)) this.updateVehicleArrow(fallbackBearing);
      this.followCamera([target.lat, target.lng], fallbackBearing);
      this.vehicleAnimationFrame = null;
      return;
    }

    const startedAt = performance.now();
    const animate = (timestamp) => {
      const progress = Math.min(1, (timestamp - startedAt) / duration);
      const traveled = totalDistance * progress;
      const segment = segments.find((item) => traveled <= item.offset + item.distance)
        || segments[segments.length - 1];
      const segmentProgress = Math.min(1, Math.max(0, (traveled - segment.offset) / segment.distance));
      const lat = segment.start.lat + (segment.end.lat - segment.start.lat) * segmentProgress;
      const lng = segment.start.lng + (segment.end.lng - segment.start.lng) * segmentProgress;
      this.vehicleMarker.setLngLat([lng, lat]);

      if (timestamp - this.lastRouteVisualSyncAt >= 80 || progress === 1) {
        this.lastRouteVisualSyncAt = timestamp;
        const routeBearing = calculateBearing(
          segment.start.lat, segment.start.lng, segment.end.lat, segment.end.lng
        );
        this.updateVehicleArrow(routeBearing);
        if (Number.isInteger(targetRouteIndex)) this.syncRouteToVisualPosition([lat, lng]);
        this.followCamera([lat, lng], routeBearing);
      }
      if (progress < 1) this.vehicleAnimationFrame = requestAnimationFrame(animate);
      else this.vehicleAnimationFrame = null;
    };
    this.vehicleAnimationFrame = requestAnimationFrame(animate);
  }

  setView(position, zoom = this.navigationZoom, { animate = false } = {}) {
    const camera = { center: toLngLat(position), zoom: Math.min(zoom, MAX_ROUTE_MAP_ZOOM) };
    if (animate) this.map.easeTo({ ...camera, duration: 500, essential: true });
    else this.map.jumpTo(camera);
  }

  setFollowVehicle(follow) {
    this.isFollowingVehicle = follow;
    if (follow && this.vehicleMarker) {
      const position = toLatLng(this.vehicleMarker.getLngLat());
      this.map.easeTo({
        center: toLngLat(position),
        zoom: this.navigationZoom,
        pitch: this.navigationPitch,
        bearing: this.currentMapBearing,
        duration: 500,
        essential: true
      });
    }
  }
}
