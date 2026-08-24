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
} from '../../../shared/utils/geoUtils.js';

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
    this.routeDistanceMeters = 0;
    this.routeDurationSeconds = 0;
    this.lastSpokenStepIndex = -1;
    this.closestCoordIndex = 0;
    this.lastGpsTimestamp = 0;
    this.lastAcceptedGpsTimestamp = 0;
    this.gpsUpdateIntervalMs = 1000;
    this.offRouteReadings = 0;
    this.lastRerouteAttemptAt = 0;
  }

  setRoute(routeData) {
    this.route = routeData;
    this.coordinates = routeData.coordinates || [];
    this.steps = routeData.steps || [];
    this.isRerouting = false;
    this.lastSpokenStepIndex = -1;
    this.closestCoordIndex = 0;
    this.activeStepIndex = 0;
    this.routeDistanceMeters = routeData.distanceMeters || 0;
    this.routeDurationSeconds = routeData.durationSeconds || 0;
    this.offRouteReadings = 0;

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
        const { latitude, longitude, speed, heading, accuracy } = pos.coords;
        const newPos = [latitude, longitude];
        const gpsTimestamp = pos.timestamp || Date.now();
        let inferredSpeedKmH = 0;
        let distanceMeters = 0;

        // Descarta saltos incompatíveis com um veículo. Leituras esparsas normais
        // continuam válidas e são suavizadas visualmente pelo MapManager.
        if (this.currentPosition && this.lastGpsTimestamp) {
          const sampleElapsedSeconds = Math.max(0.1, (gpsTimestamp - this.lastGpsTimestamp) / 1000);
          const movementElapsedSeconds = Math.max(
            0.1,
            (gpsTimestamp - (this.lastAcceptedGpsTimestamp || this.lastGpsTimestamp)) / 1000
          );
          this.gpsUpdateIntervalMs = Math.min(2500, Math.max(400, sampleElapsedSeconds * 1000));
          distanceMeters = calculateDistance(
            this.currentPosition[0],
            this.currentPosition[1],
            newPos[0],
            newPos[1]
          );
          inferredSpeedKmH = (distanceMeters / movementElapsedSeconds) * 3.6;
          const reportedSpeedKmH = Number.isFinite(speed) ? speed * 3.6 : 0;
          const isImplausibleJump = inferredSpeedKmH > 220
            && reportedSpeedKmH < 180
            && (accuracy || 0) > 20;

          if (isImplausibleJump) {
            console.warn('Salto impreciso do GPS ignorado:', {
              distanceMeters: Math.round(distanceMeters),
              accuracy: Math.round(accuracy || 0)
            });
            return;
          }
        }
        this.lastGpsTimestamp = gpsTimestamp;

        // Só considera deslocamento quando ele supera a incerteza informada pelo
        // sensor. Girar ou inclinar o celular parado não deve alterar o rumo.
        const movementThresholdMeters = Math.max(8, Math.min(Number(accuracy) || 8, 20));
        const reportedSpeedKmH = Number.isFinite(speed) ? speed * 3.6 : 0;
        const hasReliableMovement = !this.currentPosition
          || reportedSpeedKmH >= 4
          || distanceMeters >= movementThresholdMeters;

        // Velocidade real do GPS em km/h
        let currentSpeed = 0;
        if (speed !== null && !isNaN(speed) && speed > 0) {
          currentSpeed = Math.round(speed * 3.6);
        } else if (hasReliableMovement && inferredSpeedKmH > 0 && inferredSpeedKmH <= 220) {
          currentSpeed = Math.round(inferredSpeedKmH);
        }
        this.currentSpeedKmH = currentSpeed;

        // Mantém o último rumo enquanto parado. O heading só é aceito quando
        // existe velocidade e deslocamento confiáveis.
        if (hasReliableMovement && currentSpeed >= 8 && heading !== null && !isNaN(heading) && heading >= 0) {
          this.currentBearing = heading;
        } else if (hasReliableMovement && currentSpeed >= 8 && this.currentPosition) {
          if (distanceMeters >= movementThresholdMeters) {
            this.currentBearing = calculateBearing(this.currentPosition[0], this.currentPosition[1], newPos[0], newPos[1]);
          }
        }

        const stablePosition = hasReliableMovement ? newPos : (this.currentPosition || newPos);
        if (hasReliableMovement) this.lastAcceptedGpsTimestamp = gpsTimestamp;
        this.currentPosition = stablePosition;
        this.processGpsUpdate(stablePosition, this.currentBearing, this.currentSpeedKmH, accuracy);
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
  processGpsUpdate(position, bearing, speedKmH, accuracyMeters = 0) {
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
          remainingCoordinates: [],
          isOffRoute: false,
          distanceFromRouteMeters: 0,
          accuracyMeters: Number(accuracyMeters) || 0
        });
      }
      return;
    }

    // 1. Projeta a posição GPS sobre a polilinha da rota
    // Com GPS impreciso, amplia moderadamente a margem para evitar falso desvio.
    const accuracyAdjustedThreshold = Math.max(
      APP_CONFIG.deviationThresholdMeters || 45,
      Math.min((Number(accuracyMeters) || 0) * 1.5, 90)
    );
    const deviationCheck = minDistanceToPolyline(
      position,
      this.coordinates,
      accuracyAdjustedThreshold
    );

    this.closestCoordIndex = deviationCheck.closestIndex;
    const predictedRoutePosition = this.predictPositionAlongRoute(
      deviationCheck.closestPoint,
      deviationCheck.closestIndex,
      speedKmH
    );

    // 2. Confirma o desvio em leituras consecutivas antes de consumir a API.
    this.offRouteReadings = deviationCheck.isOffRoute ? this.offRouteReadings + 1 : 0;
    const now = Date.now();
    const hasEnoughConfirmations = this.offRouteReadings >= (APP_CONFIG.rerouteConfirmationReadings || 2);
    const cooldownElapsed = now - this.lastRerouteAttemptAt >= (APP_CONFIG.rerouteRetryCooldownMs || 5000);

    if (hasEnoughConfirmations && cooldownElapsed && !this.isRerouting) {
      this.isRerouting = true;
      this.lastRerouteAttemptAt = now;
      if (this.options.onOffRoute) {
        this.options.onOffRoute(position, deviationCheck.distance);
      } else {
        this.isRerouting = false;
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

    // Mantém a velocidade média prevista pela rota TomTom, que já incorpora
    // trânsito histórico e ao vivo, em vez de substituir o ETA pela velocidade instantânea.
    const remainingDurationSeconds = this.routeDistanceMeters > 0 && this.routeDurationSeconds > 0
      ? Math.round(this.routeDurationSeconds * (remainingMeters / this.routeDistanceMeters))
      : 0;

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
        remainingCoordinates,
        closestCoordIndex: this.closestCoordIndex,
        displayPosition: predictedRoutePosition.position,
        displayCoordIndex: predictedRoutePosition.coordIndex,
        isOffRoute: deviationCheck.isOffRoute,
        distanceFromRouteMeters: Math.round(deviationCheck.distance),
        accuracyMeters: Number(accuracyMeters) || 0
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

  predictPositionAlongRoute(snappedPosition, closestIndex, speedKmH) {
    if (!snappedPosition || this.coordinates.length < 2) {
      return { position: snappedPosition, coordIndex: closestIndex };
    }

    const predictionSeconds = Math.min(2, Math.max(0.6, this.gpsUpdateIntervalMs / 1000));
    let metersToAdvance = Math.min(35, Math.max(0, speedKmH) / 3.6 * predictionSeconds);
    let currentPoint = snappedPosition;
    let currentIndex = closestIndex;

    for (let index = closestIndex + 1; index < this.coordinates.length; index++) {
      const nextPoint = this.coordinates[index];
      const segmentMeters = calculateDistance(
        currentPoint[0],
        currentPoint[1],
        nextPoint[0],
        nextPoint[1]
      );

      if (segmentMeters > 0 && metersToAdvance <= segmentMeters) {
        const fraction = metersToAdvance / segmentMeters;
        return {
          position: [
            currentPoint[0] + (nextPoint[0] - currentPoint[0]) * fraction,
            currentPoint[1] + (nextPoint[1] - currentPoint[1]) * fraction
          ],
          coordIndex: Math.max(closestIndex, index - 1)
        };
      }

      metersToAdvance -= segmentMeters;
      currentPoint = nextPoint;
      currentIndex = index;
      if (metersToAdvance <= 0) break;
    }

    return { position: currentPoint, coordIndex: currentIndex };
  }

  finishRerouting() {
    this.isRerouting = false;
    this.offRouteReadings = 0;
  }
}
