import test from 'node:test';
import assert from 'node:assert/strict';
import {
  adaptCanonicalRoute,
  parseFlutterEnvelope,
  validateExternalNavigationPayload
} from '../src/shared/integration/tripContract.js';
import { DEMO_CANONICAL_ROUTE } from '../src/shared/simulation/demoTrip.js';

function canonicalRoute(version = 3) {
  return {
    routeId: 'route-1',
    version,
    calculatedAt: '2026-08-24T18:00:00.000Z',
    origin: { id: 'origin', sequence: 0, kind: 'origin', label: 'Empresa', lat: -23.5, lng: -46.6 },
    stops: [{ id: 'stop-1', sequence: 1, kind: 'stop', label: 'Passageiro', lat: -23.51, lng: -46.61 }],
    destination: { id: 'destination', sequence: 2, kind: 'destination', label: 'Destino', lat: -23.52, lng: -46.62 },
    coordinates: [
      { lat: -23.5, lng: -46.6 },
      { lat: -23.51, lng: -46.61 },
      { lat: -23.52, lng: -46.62 }
    ],
    distanceMeters: 3500,
    durationSeconds: 720,
    trafficDelaySeconds: 120,
    trafficSections: [{ startIndex: 1, endIndex: 2, delaySeconds: 120, category: 'JAM' }],
    instructions: [{
      id: 'instruction-1',
      instruction: 'Vire à direita',
      streetName: 'Rua Azul',
      distanceMeters: 500,
      durationSeconds: 90,
      type: 'TURN',
      modifier: 'RIGHT',
      icon: 'turn-right',
      location: { lat: -23.51, lng: -46.61 },
      coordinateIndex: 1
    }]
  };
}

test('adapta a rota canônica sem perder versão, instruções e trânsito', () => {
  const adapted = adaptCanonicalRoute(canonicalRoute());
  assert.equal(adapted.provider, 'canonical');
  assert.equal(adapted.version, 3);
  assert.deepEqual(adapted.coordinates[1], [-23.51, -46.61]);
  assert.equal(adapted.steps[0].coordIndex, 1);
  assert.equal(adapted.steps[0].rawName, 'Rua Azul');
  assert.deepEqual(adapted.steps[0].location, [-23.51, -46.61]);
  assert.equal(adapted.trafficSections[0].startPointIndex, 1);
  assert.equal(adapted.trafficSections[0].delayInSeconds, 120);
});

test('a rota fixa do simulador respeita o contrato canônico', () => {
  const adapted = adaptCanonicalRoute(DEMO_CANONICAL_ROUTE);
  assert.ok(adapted.coordinates.length > 2);
  assert.ok(adapted.steps.length > 0);
  assert.equal(adapted.stops.length, 1);
});

test('aceita bootstrap válido da corrida esperada', () => {
  const envelope = parseFlutterEnvelope({
    schemaVersion: 1,
    type: 'trip.bootstrap',
    eventId: 'event-1',
    tripId: 'trip-1',
    sentAt: '2026-08-24T18:00:01.000Z',
    payload: {
      role: 'driver',
      tripStatus: 'in_progress',
      waiting: { active: false, startedAt: null },
      route: canonicalRoute(),
      vehiclePosition: {
        lat: -23.5,
        lng: -46.6,
        accuracy: 4,
        speed: 10,
        heading: 90,
        timestamp: '2026-08-24T18:00:00.500Z'
      }
    }
  }, 'trip-1');

  assert.equal(envelope.payload.route.version, 3);
});

test('rejeita corrida diferente e instrução fora do traçado', () => {
  assert.throws(() => parseFlutterEnvelope({
    schemaVersion: 1,
    type: 'vehicle.location',
    eventId: 'event-2',
    tripId: 'outra-corrida',
    sentAt: '2026-08-24T18:00:01.000Z',
    payload: { lat: -23.5, lng: -46.6, timestamp: '2026-08-24T18:00:01.000Z' }
  }, 'trip-1'), /Corrida/);

  const invalidRoute = canonicalRoute();
  invalidRoute.instructions[0].coordinateIndex = 50;
  assert.throws(() => adaptCanonicalRoute(invalidRoute), /fora da rota/);
});

test('valida pedido restrito de navegação externa', () => {
  const payload = validateExternalNavigationPayload({
    provider: 'google_maps',
    origin: { lat: -23.5, lng: -46.6 },
    destination: {
      id: 'destination',
      sequence: 0,
      kind: 'destination',
      label: 'Destino',
      lat: -23.52,
      lng: -46.62
    }
  });
  assert.equal(payload.provider, 'google_maps');
  assert.throws(
    () => validateExternalNavigationPayload({ ...payload, provider: 'browser' }),
    /Provedor/
  );
});
