import { THEME_COLORS } from '../../../shared/config/routeConfig.js';
import { disableMapPropagation } from '../../../shared/utils/domUtils.js';
import {
  OPEN_FREE_MAP_STYLE,
  boundsFromCoordinates,
  createHtmlElement,
  emptyLineFeature,
  featureCollection,
  lineFeature,
  maplibregl,
  setSourceData,
  toLngLat
} from '../../../shared/map/openFreeMap.js';

const MAP_IDS = Object.freeze({
  routeSource: 'passenger-route-source',
  routeOutline: 'passenger-route-outline',
  routeLine: 'passenger-route-line',
  trafficSource: 'passenger-traffic-source',
  trafficLine: 'passenger-traffic-line'
});

export class PassengerMapManager {
  constructor(containerId, options = {}) {
    this.containerId = containerId;
    this.options = options;
    this.map = null;
    this.mapLoaded = false;
    this.routeCoordinates = [];
    this.trafficSections = [];
    this.vehicleMarker = null;
    this.originMarker = null;
    this.destinationMarker = null;
    this.stopMarkers = [];
    this.vehicleAnimationFrame = null;
    this.trafficPopup = null;
    this.trafficEventsBound = false;
    this.isProgrammaticMove = false;
    this.isOverview = true;
  }

  init(initialCenter, initialZoom = 13) {
    this.map = new maplibregl.Map({
      container: this.containerId,
      style: OPEN_FREE_MAP_STYLE,
      center: toLngLat(initialCenter),
      zoom: initialZoom,
      pitch: 0,
      bearing: 0,
      attributionControl: true,
      maxZoom: 20,
      cooperativeGestures: false
    });

    const initializeStyleLayers = () => {
      if (this.mapLoaded || !this.map.getStyle()?.layers?.length) return;
      this.mapLoaded = true;
      document.getElementById(this.containerId)?.setAttribute('data-map-ready', 'true');
      this.ensureMapLayers();
      this.renderRoute();
      this.map.resize();
    };
    this.map.on('styledata', initializeStyleLayers);
    this.map.on('load', initializeStyleLayers);

    ['dragstart', 'zoomstart', 'rotatestart', 'pitchstart'].forEach((eventName) => {
      this.map.on(eventName, (event) => {
        if (this.isProgrammaticMove || !event.originalEvent) return;
        this.setOverviewState(false);
      });
    });

    const statusCard = document.querySelector('.passenger-status-card');
    const rideCard = document.getElementById('passenger-ride-card');
    const recenterButton = document.getElementById('passenger-recenter');
    [statusCard, rideCard, recenterButton].forEach(disableMapPropagation);
    window.setTimeout(() => this.map.resize(), 0);
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
        paint: { 'line-color': '#FFFFFF', 'line-width': 12, 'line-opacity': 0.95 }
      });
    }
    if (!this.map.getLayer(MAP_IDS.routeLine)) {
      this.map.addLayer({
        id: MAP_IDS.routeLine,
        type: 'line',
        source: MAP_IDS.routeSource,
        layout: { 'line-cap': 'round', 'line-join': 'round' },
        paint: { 'line-color': THEME_COLORS.accentBlue, 'line-width': 7, 'line-opacity': 1 }
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
          'line-opacity': 1
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
        this.trafficPopup?.remove();
        this.trafficPopup = new maplibregl.Popup({
          closeButton: false,
          closeOnClick: true,
          offset: 8,
          className: 'passenger-traffic-popup'
        })
          .setLngLat(event.lngLat)
          .setText(properties.delayText || 'Trânsito lento')
          .addTo(this.map);
      });
    }
  }

  setOverviewState(isOverview) {
    if (this.isOverview === isOverview) return;
    this.isOverview = isOverview;
    this.options.onOverviewChange?.(isOverview);
  }

  drawRoute(coordinates, trafficSections = []) {
    if (!Array.isArray(coordinates) || coordinates.length < 2) return;
    this.routeCoordinates = coordinates.map((coordinate) => [...coordinate]);
    this.trafficSections = (trafficSections || []).filter((section) => {
      const start = Number(section.startPointIndex);
      const end = Number(section.endPointIndex);
      return Number.isInteger(start) && Number.isInteger(end) && end > start;
    });
    this.renderRoute();
  }

  renderRoute() {
    if (!this.mapLoaded) return;
    this.ensureMapLayers();
    setSourceData(
      this.map,
      MAP_IDS.routeSource,
      this.routeCoordinates.length >= 2 ? lineFeature(this.routeCoordinates) : emptyLineFeature()
    );
    const trafficFeatures = this.trafficSections.flatMap((section) => {
      const start = Math.max(0, Number(section.startPointIndex));
      const end = Math.min(this.routeCoordinates.length - 1, Number(section.endPointIndex));
      const segment = this.routeCoordinates.slice(start, end + 1);
      if (segment.length < 2) return [];
      const delay = Math.max(0, Number(section.delayInSeconds) || 0);
      return [lineFeature(segment, {
        color: this.trafficColor(section),
        delayText: delay >= 60 ? `${Math.round(delay / 60)} min de atraso` : 'Trânsito lento'
      })];
    });
    setSourceData(this.map, MAP_IDS.trafficSource, featureCollection(trafficFeatures));
  }

  clearRoute() {
    this.routeCoordinates = [];
    this.trafficSections = [];
    this.renderRoute();
  }

  trafficColor(section) {
    const category = String(section.simpleCategory || '').toUpperCase();
    const delay = Number(section.delayInSeconds) || 0;
    const magnitude = Number(section.magnitudeOfDelay) || 0;
    if (category === 'ROAD_CLOSURE') return '#7F1D1D';
    if (magnitude >= 3 || delay >= 600) return '#DC2626';
    if (magnitude === 2 || delay >= 180) return '#F97316';
    return '#FACC15';
  }

  createMarker(className, html, position, anchor = 'center') {
    const element = createHtmlElement(className, html);
    return new maplibregl.Marker({ element, anchor })
      .setLngLat(toLngLat(position))
      .addTo(this.map);
  }

  setOriginMarker(position) {
    this.originMarker?.remove();
    this.originMarker = this.createMarker(
      'passenger-pin-wrapper maplibre-passenger-origin',
      '<span class="passenger-origin-pin"></span>',
      position
    );
  }

  setDestinationMarker(position) {
    this.destinationMarker?.remove();
    this.destinationMarker = this.createMarker(
      'passenger-pin-wrapper maplibre-passenger-destination',
      `<span class="passenger-destination-pin">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg>
      </span>`,
      position,
      'bottom'
    );
  }

  setStopMarkers(stops = []) {
    this.stopMarkers.forEach((marker) => marker.remove());
    this.stopMarkers = stops.map((stop, index) => this.createMarker(
      'passenger-pin-wrapper maplibre-passenger-stop',
      `<span class="passenger-stop-pin" aria-label="Parada ${index + 1}">${index + 1}</span>`,
      [stop.lat, stop.lng]
    ));
  }

  updateVehiclePosition(position, bearing = 0, animate = true) {
    if (!this.vehicleMarker) {
      const element = createHtmlElement(
        'passenger-vehicle-wrapper maplibre-passenger-vehicle',
        `<div class="passenger-vehicle-marker">
          <div class="passenger-vehicle-heading">
            <svg viewBox="0 0 32 32" aria-hidden="true"><path d="M16 3 27 26l-11-4-11 4L16 3Z"/></svg>
          </div>
        </div>`
      );
      this.vehicleMarker = new maplibregl.Marker({
        element,
        anchor: 'center',
        rotationAlignment: 'map'
      })
        .setLngLat(toLngLat(position))
        .setRotation(Number.isFinite(bearing) ? bearing : 0)
        .addTo(this.map);
      return;
    }
    this.setVehicleBearing(bearing);
    if (!animate) {
      this.vehicleMarker.setLngLat(toLngLat(position));
      return;
    }
    this.animateVehicleTo(position);
  }

  setVehicleBearing(bearing) {
    this.vehicleMarker?.setRotation(Number.isFinite(bearing) ? bearing : 0);
  }

  animateVehicleTo(targetPosition) {
    if (this.vehicleAnimationFrame) cancelAnimationFrame(this.vehicleAnimationFrame);
    const start = this.vehicleMarker.getLngLat();
    const target = { lat: Number(targetPosition[0]), lng: Number(targetPosition[1]) };
    const startedAt = performance.now();
    const duration = 850;
    const frame = (now) => {
      const linear = Math.min(1, (now - startedAt) / duration);
      const eased = 1 - Math.pow(1 - linear, 3);
      this.vehicleMarker.setLngLat([
        start.lng + (target.lng - start.lng) * eased,
        start.lat + (target.lat - start.lat) * eased
      ]);
      if (linear < 1) this.vehicleAnimationFrame = requestAnimationFrame(frame);
      else this.vehicleAnimationFrame = null;
    };
    this.vehicleAnimationFrame = requestAnimationFrame(frame);
  }

  showRouteOverview() {
    const bounds = boundsFromCoordinates(this.routeCoordinates);
    if (!bounds) return;
    this.isProgrammaticMove = true;
    this.setOverviewState(true);
    this.map.fitBounds(bounds, {
      padding: { top: 150, right: 34, bottom: 220, left: 34 },
      maxZoom: 16,
      duration: 550,
      pitch: 0,
      bearing: 0
    });
    window.setTimeout(() => {
      this.isProgrammaticMove = false;
    }, 650);
  }
}
