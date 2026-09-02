import { calculateDistance } from '../utils/geoUtils.js';

export const ROUTE_LEG_OPACITY = Object.freeze({
  completed: 0.34,
  current: 1,
  future: 0.24
});

export function findStopCoordinateIndices(coordinates, stops = []) {
  if (!Array.isArray(coordinates) || coordinates.length < 2) return [];

  let minimumIndex = 1;
  return [...stops]
    .sort((a, b) => Number(a.sequence) - Number(b.sequence))
    .map((stop) => {
      let closestIndex = minimumIndex;
      let closestDistance = Infinity;
      for (let index = minimumIndex; index < coordinates.length - 1; index++) {
        const coordinate = coordinates[index];
        const distance = calculateDistance(
          Number(stop.lat), Number(stop.lng), coordinate[0], coordinate[1]
        );
        if (distance < closestDistance) {
          closestDistance = distance;
          closestIndex = index;
        }
      }
      minimumIndex = Math.min(coordinates.length - 1, closestIndex + 1);
      return closestIndex;
    });
}

export function getRouteLegRanges(coordinateCount, stopCoordinateIndices = []) {
  if (coordinateCount < 2) return [];
  const lastIndex = coordinateCount - 1;
  const boundaries = [
    0,
    ...stopCoordinateIndices.map((index) => Math.max(1, Math.min(lastIndex - 1, index))),
    lastIndex
  ];
  return boundaries.slice(0, -1).map((startIndex, index) => ({
    legIndex: index,
    startIndex,
    endIndex: boundaries[index + 1]
  }));
}

export function getActiveLegIndex(progressIndex, stopCoordinateIndices = []) {
  let activeLegIndex = 0;
  while (
    activeLegIndex < stopCoordinateIndices.length
    && progressIndex >= stopCoordinateIndices[activeLegIndex]
  ) {
    activeLegIndex++;
  }
  return activeLegIndex;
}

export function getRouteLegStatus(legIndex, activeLegIndex) {
  if (legIndex < activeLegIndex) return 'completed';
  if (legIndex > activeLegIndex) return 'future';
  return 'current';
}

export function buildRouteLegFeatures(
  coordinates,
  stopCoordinateIndices,
  activeLegIndex,
  lineFeature,
  { startIndex = 0, startPosition = null } = {}
) {
  return getRouteLegRanges(coordinates.length, stopCoordinateIndices).flatMap((range) => {
    if (range.endIndex <= startIndex) return [];
    const clippedStart = Math.max(range.startIndex, startIndex);
    let segment = coordinates.slice(clippedStart, range.endIndex + 1);
    if (startPosition && clippedStart === startIndex) {
      segment = [startPosition, ...coordinates.slice(startIndex + 1, range.endIndex + 1)];
    }
    if (segment.length < 2) return [];
    const status = getRouteLegStatus(range.legIndex, activeLegIndex);
    const opacity = ROUTE_LEG_OPACITY[status];
    return [lineFeature(segment, {
      legIndex: range.legIndex,
      legStatus: status,
      opacity,
      outlineOpacity: opacity * 0.92
    })];
  });
}
