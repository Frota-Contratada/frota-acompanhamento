import test from 'node:test';
import assert from 'node:assert/strict';

import { hasArrivedAtScheduledStop } from '../src/features/driver/utils/stopArrival.js';

const baseState = {
  distanceToStopMeters: 30,
  speedKmH: 4,
  closestCoordIndex: 49,
  stopCoordinateIndex: 50,
  thresholdMeters: 55,
  maxSpeedKmH: 12
};

test('reconhece a chegada lenta a uma parada programada', () => {
  assert.equal(hasArrivedAtScheduledStop(baseState), true);
});

test('não abre confirmação antes de chegar ou passando em alta velocidade', () => {
  assert.equal(hasArrivedAtScheduledStop({ ...baseState, distanceToStopMeters: 80 }), false);
  assert.equal(hasArrivedAtScheduledStop({ ...baseState, speedKmH: 30 }), false);
  assert.equal(hasArrivedAtScheduledStop({ ...baseState, closestCoordIndex: 20 }), false);
});
