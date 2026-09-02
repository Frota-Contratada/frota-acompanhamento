import test from 'node:test';
import assert from 'node:assert/strict';

import {
  buildRouteLegFeatures,
  findStopCoordinateIndices,
  getActiveLegIndex
} from '../src/shared/map/routeLegs.js';

const coordinates = [
  [0, 0],
  [0, 0.01],
  [0, 0.02],
  [0, 0.03],
  [0, 0.04]
];

const lineFeature = (points, properties) => ({ points, properties });

test('localiza as paradas na geometria e preserva a ordem', () => {
  const indices = findStopCoordinateIndices(coordinates, [
    { sequence: 2, lat: 0, lng: 0.03 },
    { sequence: 1, lat: 0, lng: 0.02 }
  ]);
  assert.deepEqual(indices, [2, 3]);
});

test('troca o trecho atual quando o veículo alcança a parada', () => {
  assert.equal(getActiveLegIndex(1, [2]), 0);
  assert.equal(getActiveLegIndex(2, [2]), 1);
});

test('mantém o trecho atual opaco e ofusca o próximo', () => {
  const features = buildRouteLegFeatures(coordinates, [2], 0, lineFeature);
  assert.equal(features.length, 2);
  assert.equal(features[0].properties.legStatus, 'current');
  assert.equal(features[0].properties.opacity, 1);
  assert.equal(features[1].properties.legStatus, 'future');
  assert.ok(features[1].properties.opacity < 1);
});
