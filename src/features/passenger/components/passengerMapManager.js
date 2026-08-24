import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { THEME_COLORS } from '../../../shared/config/routeConfig.js';
import { disableLeafletPropagation } from '../../../shared/utils/domUtils.js';

export class PassengerMapManager {
  constructor(containerId, options = {}) {
    this.containerId = containerId;
    this.options = options;
    this.map = null;
    this.routeCoordinates = [];
    this.routeLayers = [];
    this.trafficLayers = [];
    this.vehicleMarker = null;
    this.originMarker = null;
    this.destinationMarker = null;
    this.vehicleAnimationFrame = null;
    this.isProgrammaticMove = false;
    this.isOverview = true;
  }

  init(initialCenter, initialZoom = 13) {
    this.map = L.map(this.containerId, {
      center: initialCenter,
      zoom: initialZoom,
      zoomControl: false,
      attributionControl: false,
      zoomSnap: 0.25,
      maxZoom: 20,
      dragging: true,
      touchZoom: true,
      scrollWheelZoom: true
    });

    L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
      maxZoom: 20,
      maxNativeZoom: 18,
      subdomains: 'abcd'
    }).addTo(this.map);

    ['dragstart', 'zoomstart'].forEach((eventName) => {
      this.map.on(eventName, () => {
        if (this.isProgrammaticMove) return;
        this.setOverviewState(false);
      });
    });

    const setupContainer = document.getElementById('setup-page-container');
    const statusCard = document.querySelector('.passenger-status-card');
    const rideCard = document.getElementById('passenger-ride-card');
    const recenterButton = document.getElementById('passenger-recenter');
    [setupContainer, statusCard, rideCard, recenterButton].forEach(disableLeafletPropagation);

    window.setTimeout(() => this.map.invalidateSize(), 0);
    return this;
  }

  setOverviewState(isOverview) {
    if (this.isOverview === isOverview) return;
    this.isOverview = isOverview;
    this.options.onOverviewChange?.(isOverview);
  }

  drawRoute(coordinates, trafficSections = []) {
    if (!Array.isArray(coordinates) || coordinates.length < 2) return;
    this.clearRoute();
    this.routeCoordinates = coordinates;

    this.routeLayers.push(
      L.polyline(coordinates, {
        color: '#FFFFFF',
        weight: 12,
        opacity: 0.95,
        lineCap: 'round',
        lineJoin: 'round',
        interactive: false
      }).addTo(this.map),
      L.polyline(coordinates, {
        color: THEME_COLORS.accentBlue,
        weight: 7,
        opacity: 1,
        lineCap: 'round',
        lineJoin: 'round',
        interactive: false
      }).addTo(this.map)
    );

    this.drawTrafficSections(trafficSections);
  }

  clearRoute() {
    [...this.routeLayers, ...this.trafficLayers].forEach((layer) => this.map?.removeLayer(layer));
    this.routeLayers = [];
    this.trafficLayers = [];
  }

  drawTrafficSections(sections = []) {
    sections.forEach((section) => {
      const start = Number(section.startPointIndex);
      const end = Number(section.endPointIndex);
      if (!Number.isInteger(start) || !Number.isInteger(end) || end <= start) return;

      const segment = this.routeCoordinates.slice(
        Math.max(0, start),
        Math.min(this.routeCoordinates.length - 1, end) + 1
      );
      if (segment.length < 2) return;

      const layer = L.polyline(segment, {
        color: this.trafficColor(section),
        weight: 8,
        opacity: 1,
        lineCap: 'round',
        lineJoin: 'round',
        interactive: true
      }).addTo(this.map);

      const delay = Math.max(0, Number(section.delayInSeconds) || 0);
      const delayText = delay >= 60 ? `${Math.round(delay / 60)} min de atraso` : 'Trânsito lento';
      layer.bindTooltip(delayText, { direction: 'top', opacity: 0.95 });
      this.trafficLayers.push(layer);
    });
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

  setOriginMarker(position) {
    if (this.originMarker) this.map.removeLayer(this.originMarker);
    const icon = L.divIcon({
      className: 'passenger-pin-wrapper',
      html: '<span class="passenger-origin-pin"></span>',
      iconSize: [18, 18],
      iconAnchor: [9, 9]
    });
    this.originMarker = L.marker(position, { icon, interactive: false }).addTo(this.map);
  }

  setDestinationMarker(position) {
    if (this.destinationMarker) this.map.removeLayer(this.destinationMarker);
    const icon = L.divIcon({
      className: 'passenger-pin-wrapper',
      html: `<span class="passenger-destination-pin">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg>
      </span>`,
      iconSize: [38, 38],
      iconAnchor: [19, 34]
    });
    this.destinationMarker = L.marker(position, { icon, interactive: false }).addTo(this.map);
  }

  updateVehiclePosition(position, bearing = 0, animate = true) {
    if (!this.vehicleMarker) {
      const icon = L.divIcon({
        className: 'passenger-vehicle-wrapper',
        html: `<div class="passenger-vehicle-marker">
          <div class="passenger-vehicle-heading">
            <svg viewBox="0 0 32 32" aria-hidden="true"><path d="M16 3 27 26l-11-4-11 4L16 3Z"/></svg>
          </div>
        </div>`,
        iconSize: [46, 46],
        iconAnchor: [23, 23]
      });
      this.vehicleMarker = L.marker(position, { icon, zIndexOffset: 1000, interactive: false }).addTo(this.map);
      this.setVehicleBearing(bearing);
      return;
    }

    this.setVehicleBearing(bearing);
    if (!animate) {
      this.vehicleMarker.setLatLng(position);
      return;
    }

    this.animateVehicleTo(position);
  }

  setVehicleBearing(bearing) {
    const heading = this.vehicleMarker?.getElement()?.querySelector('.passenger-vehicle-heading');
    if (heading) heading.style.transform = `rotate(${Number.isFinite(bearing) ? bearing : 0}deg)`;
  }

  animateVehicleTo(targetPosition) {
    if (this.vehicleAnimationFrame) cancelAnimationFrame(this.vehicleAnimationFrame);

    const start = this.vehicleMarker.getLatLng();
    const target = L.latLng(targetPosition);
    const startedAt = performance.now();
    const duration = 850;

    const frame = (now) => {
      const linear = Math.min(1, (now - startedAt) / duration);
      const eased = 1 - Math.pow(1 - linear, 3);
      this.vehicleMarker.setLatLng([
        start.lat + (target.lat - start.lat) * eased,
        start.lng + (target.lng - start.lng) * eased
      ]);
      if (linear < 1) this.vehicleAnimationFrame = requestAnimationFrame(frame);
    };

    this.vehicleAnimationFrame = requestAnimationFrame(frame);
  }

  showRouteOverview() {
    if (!this.routeCoordinates.length) return;
    this.isProgrammaticMove = true;
    this.setOverviewState(true);
    this.map.fitBounds(L.latLngBounds(this.routeCoordinates), {
      paddingTopLeft: [34, 150],
      paddingBottomRight: [34, 220],
      maxZoom: 16,
      animate: true,
      duration: 0.55
    });
    window.setTimeout(() => {
      this.isProgrammaticMove = false;
    }, 650);
  }
}
