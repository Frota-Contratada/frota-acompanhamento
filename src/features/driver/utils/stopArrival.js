export function hasArrivedAtScheduledStop({
  distanceToStopMeters,
  speedKmH,
  closestCoordIndex,
  stopCoordinateIndex,
  thresholdMeters,
  maxSpeedKmH
}) {
  const reachedRoutePoint = !Number.isInteger(stopCoordinateIndex)
    || (Number.isInteger(closestCoordIndex) && closestCoordIndex >= stopCoordinateIndex - 1);

  return Number.isFinite(distanceToStopMeters)
    && distanceToStopMeters <= thresholdMeters
    && reachedRoutePoint
    && Number(speedKmH || 0) <= maxSpeedKmH;
}
