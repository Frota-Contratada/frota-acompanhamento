/**
 * Motor de Navegação Baseado em GPS Real em Tempo Real
 * Rastreia o sensor de GPS do smartphone (watchPosition),
 * calcula velocidade, azimute, desvio de rota, manobras e métricas.
 */

import { APP_CONFIG } from '../config.js';
import {
  calculateDistance,
  calculateBearing,
  minDistanceToPolyline
} from './geoUtils.js';

export class GpsNavigationEngine {
  constructor(options = {}) {
    this.options = options;
    this.route = null;
    this.coordinates = [];
    this.steps = [];
    this.currentPosition = null;
    this.currentBearing = 0;
    this.currentSpeedKmH = 0;
    this.watchId = null;
    this.isTracking = false;
    this.isRerouting = false;
    this.activeStepIndex = 0;
    this.lastSpokenStepIndex = -1;
    this.closestCoordIndex = 0;
  }

  setRoute(routeData) {
    this.route = routeData;
    this.coordinates = routeData.coordinates || [];
    this.steps = routeData.steps || [];
    this.isRerouting = false;
    this.lastSpokenStepIndex = -1;
    this.closestCoordIndex = 0;
    this.activeStepIndex = 0;

    if (this.currentPosition) {
      this.processGpsUpdate(this.currentPosition, this.currentBearing, this.currentSpeedKmH);
    }
  }

  startGpsTracking() {
    if (!('geolocation' in navigator)) {
      if (this.options.onGpsError) {
        this.options.onGpsError('Geolocalização não suportada no seu navegador.');
      }
      return;
    }

    if (this.watchId !== null) {
      navigator.geolocation.clearWatch(this.watchId);
    }

    this.isTracking = true;

    this.watchId = navigator.geolocation.watchPosition(
      (pos) => {
        const { latitude, longitude, speed, heading } = pos.coords;
        const newPos = [latitude, longitude];

        // Velocidade real do GPS em km/h
        let currentSpeed = 0;
        if (speed !== null && !isNaN(speed) && speed > 0) {
          currentSpeed = Math.round(speed * 3.6);
        }
        this.currentSpeedKmH = currentSpeed;

        // Azimute / Heading real do sensor ou calculado por movimento
        if (heading !== null && !isNaN(heading) && heading >= 0) {
          this.currentBearing = heading;
        } else if (this.currentPosition) {
          const distMoved = calculateDistance(this.currentPosition[0], this.currentPosition[1], newPos[0], newPos[1]);
          if (distMoved > 2.5) {
            this.currentBearing = calculateBearing(this.currentPosition[0], this.currentPosition[1], newPos[0], newPos[1]);
          }
        }

        this.currentPosition = newPos;
        this.processGpsUpdate(newPos, this.currentBearing, this.currentSpeedKmH);
      },
      (err) => {
        console.warn('Erro no sensor GPS:', err);
        if (this.options.onGpsError) {
          this.options.onGpsError('Sinal de GPS indisponível ou permissão não concedida.');
        }
      },
      {
        enableHighAccuracy: true,
        maximumAge: 1000,
        timeout: 10000
      }
    );
  }

  stopGpsTracking() {
    this.isTracking = false;
    if (this.watchId !== null) {
      navigator.geolocation.clearWatch(this.watchId);
      this.watchId = null;
    }
  }

  /**
   * Processa a posição recebida do GPS em relação à rota ativa
   */
  processGpsUpdate(position, bearing, speedKmH) {
    if (!position) return;

    if (!this.coordinates || this.coordinates.length < 2) {
      if (this.options.onUpdate) {
        this.options.onUpdate({
          position,
          bearing,
          speedKmH,
          remainingDistanceMeters: 0,
          remainingDurationSeconds: 0,
          activeStep: null,
          nextStep: null,
          distanceToStep: 0,
          remainingCoordinates: []
        });
      }
      return;
    }

    // 1. Projeta a posição GPS sobre a polilinha da rota
    const deviationCheck = minDistanceToPolyline(
      position,
      this.coordinates,
      APP_CONFIG.deviationThresholdMeters || 45
    );

    this.closestCoordIndex = deviationCheck.closestIndex;

    // 2. Verifica desvio de rota para recálculo automático
    if (deviationCheck.isOffRoute && !this.isRerouting) {
      this.isRerouting = true;
      if (this.options.onOffRoute) {
        this.options.onOffRoute(position, deviationCheck.distance);
      }
    }

    // 3. Calcula distância e tempo restantes até o destino
    let remainingMeters = 0;
    const curSegmentEnd = this.coordinates[this.closestCoordIndex + 1] || this.coordinates[this.coordinates.length - 1];
    remainingMeters += calculateDistance(position[0], position[1], curSegmentEnd[0], curSegmentEnd[1]);

    for (let i = this.closestCoordIndex + 1; i < this.coordinates.length - 1; i++) {
      remainingMeters += calculateDistance(
        this.coordinates[i][0], this.coordinates[i][1],
        this.coordinates[i + 1][0], this.coordinates[i + 1][1]
      );
    }

    const estimatedSpeedKmH = speedKmH > 5 ? speedKmH : 40;
    const remainingDurationSeconds = Math.round(remainingMeters / ((estimatedSpeedKmH * 1000) / 3600)) || 0;

    // 4. Determina a manobra ativa
    this.findActiveStepIndex();
    const activeStep = this.steps[this.activeStepIndex] || this.steps[this.steps.length - 1] || null;
    const nextStep = this.steps[this.activeStepIndex + 1] || null;

    let distanceToStep = 0;
    if (activeStep) {
      distanceToStep = calculateDistance(
        position[0], position[1],
        activeStep.location[0], activeStep.location[1]
      );
    }

    if (this.activeStepIndex !== this.lastSpokenStepIndex && activeStep) {
      this.lastSpokenStepIndex = this.activeStepIndex;
      if (this.options.onStepChange) {
        this.options.onStepChange(activeStep, distanceToStep);
      }
    }

    // 5. Verifica se chegou ao destino (< 30m do ponto final)
    const destCoord = this.coordinates[this.coordinates.length - 1];
    const distToDestination = calculateDistance(position[0], position[1], destCoord[0], destCoord[1]);
    if (distToDestination < 30) {
      if (this.options.onDestinationReached) {
        this.options.onDestinationReached();
      }
    }

    const remainingCoordinates = [
      position,
      ...this.coordinates.slice(this.closestCoordIndex + 1)
    ];

    if (this.options.onUpdate) {
      this.options.onUpdate({
        position,
        bearing,
        speedKmH,
        remainingDistanceMeters: Math.round(remainingMeters),
        remainingDurationSeconds,
        activeStep,
        nextStep,
        distanceToStep: Math.round(distanceToStep),
        remainingCoordinates
      });
    }
  }

  findActiveStepIndex() {
    if (!this.steps || this.steps.length === 0) return;

    let foundIdx = this.steps.length - 1;
    for (let i = 0; i < this.steps.length; i++) {
      if (this.steps[i].coordIndex > this.closestCoordIndex) {
        foundIdx = i;
        break;
      }
    }

    this.activeStepIndex = foundIdx;
  }
}
